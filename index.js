var contractSource = `
payable contract ServiceLocatorContract =

    record service = {
         index               : int,
         sAddress            : address,
         sName               : string,
         sLocation           : string,
         mapUrl              : string,
         active              : bool,
         amount              : int,
         review              : list(user_review)
         
         }
    record user_review ={
           index : int,
           review_owner : address,
           review_description : string
        }

    record state ={
          services : map(int, service),
          user_reviews : map(int, user_review),
          sLength : int,
          rLength :int
          }
  
    entrypoint init() = {
         services = {},
         user_reviews = {},
         sLength = 0,
         rLength = 0
         }
  
    stateful entrypoint storeService(name : string, loc :string, url :string) =
        let service ={
            index       = sLength() +1,
            sAddress = Call.caller,
            sName       = name,
            sLocation   = loc,
            mapUrl      = url,
            amount      = 0,
            active      = true,
            review      = [] 
            }
        
        let index = sLength() +1
        
        put( state { services[index] = service, sLength = index})
        
    entrypoint getService(index :int ) :service =
         state.services[index]
            
    payable stateful entrypoint donateForService(index : int) =
          let service = getService(index)
          Chain.spend(service.sAddress,Call.value)
          let amount =service.amount+Call.value
          let updateService =state.services{[index].amount = amount }
          put(state {services = updateService})
                   
    stateful entrypoint activateService(index : int) =
         let service          =  getService(index)
         let update    =  state.services{[index].active = true }
         put(state {services  =  update })
         
    
    stateful entrypoint deactivateService(index : int) =
         let service          =  getService(index)
         let update    =  state.services{[index].active = false }
         put(state {services  =  update})
    
    stateful entrypoint addReview(index:int, review': string) =
         let i = rLength() + 1

         let service =  getService(index)
         let review = {
                  index = i,
                  review_owner =Call.caller,
                  review_description =review'
                  }  

         let inter_review =state.services{[index].review = review::state.services[index].review}
         put(state{services = inter_review, rLength = i})
          
    entrypoint getServiceReview(service_id: int):list(user_review) =
        let service =  getService(service_id)
        state.services[service_id].review


    entrypoint sLength() : int =
         state.sLength  

    entrypoint rLength() : int =
         state.rLength  
`;
var contractAddress= "ct_23GXuvUPdb6ouvMBSCtaJQne5VwkYgHZyssJx7AfMkXkVpSVRP";

var client =null;

var serviceArray = [];
var reviewArray = [];
var serviceLength =0;

async function renderService() {
    var template=$('#template').html();
    Mustache.parse(template);
    var render = Mustache.render(template, {serviceArray,reviewArray});
    $('#service-lists').html(render);
   
}



async function callStatic(func,args){
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{callStatic : true}).catch(e =>console.error(e))

    const decodedGet = await calledGet.decode().catch(e =>console.error(e));
    
    return decodedGet;
}

async function contractCall(func, args,value) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{amount : value}).catch(e =>console.error(e))

    return calledGet;
  }

window.addEventListener('load',async () =>{
    $('#loading').show();
    client = await Ae.Aepp();

    serviceLength = await callStatic('sLength', []);

    for (let i = 1; i <= serviceLength; i++) {
       const s = await callStatic('getService',[i]);

        serviceArray.push({
            sOwner           : s.sAddress,
            sName            : s.sName,
            sMapUrl          : s.mapUrl,
            amount           : s.amount,
            active           : s.active,
            id               : s.index

          
        })

        const reviews =await callStatic('getServiceReview',[s.index])
        console.log(reviews.length)
        for (let j = 0; j < reviews.length; j++) {
           reviewArray.push({
                index     : reviews[j].index,
                review_owner :reviews[j].review_owner,
                review_description : reviews[j].review_description
           })
        }


        
    }
   console.log(reviewArray)

 renderService();

$('#loading').hide();
});



$(document).on('click','#saveBtn', async function(){
    $('#loading').show();
    const name = $('#sName').val();
    const sLocation = $('#sLocation').val();
    const mapUrl = $('#mapUrl').val();



await contractCall('storeService',[name, sLocation,mapUrl], 0);
     renderService();

$('#loading').hide();
});


$('#service-lists').on('click','.donateBtn', async function(e){
    $('#loading').show();
    
    const service_id = e.target.id;
    const amount = $('input[id='+service_id+']').val();
    
  console.log("amount "+amount+ "-"+service_id)
  await contractCall('donateForService',[service_id], amount);
  
  
  location.reload((true));
  renderService();
  $('#loading').hide();
  });
  
  
  $('#service-lists').on('click','.activateBtn', async function(e){
    $('#loading').show();
    
    const service_id = e.target.id;
    
  await contractCall('activateService',[service_id], 0);
  
  location.reload((true));
  renderService();
  $('#loading').hide();
  });
  
  $('#service-lists').on('click','.deactivateBtn', async function(e){
    $('#loading').show();
    
    const service_id = e.target.id;
    
  
  await contractCall('deactivateService',[service_id], 0);

  location.reload((true));
  renderService();
  $('#loading').hide();
  });


  $(document).on('click','.submitReviewBtn', async function(e){
    $('#loading').show();
    const service_id = e.target.id;
    console.log("serv_id= "+service_id)
    const comment = $('input[id='+'c'+service_id+']').val();
    console.log("comm= "+comment)
   await contractCall('addReview',[service_id, comment], 0);
   location.reload((true));
     renderService();

$('#loading').hide();
});

