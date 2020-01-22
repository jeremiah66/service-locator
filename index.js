var contractSource = `
payable contract ServiceLocatorContract =

  record service = {
         index               : int,
         sAddress            : address,
         sName               : string,
         sLocation           : string,
         mapUrl              : string,
         active              : bool,
         amount              : int
         
         }

  record state ={
          services : map(int, service),
          sLength : int
          }
  
  entrypoint init() = {
         services = {},
         sLength = 0 
         }
  
  stateful entrypoint storeService(name : string, loc :string, url :string) =
        let service ={
            index       = sLength() +1,
            sAddress = Call.caller,
            sName       = name,
            sLocation   = loc,
            mapUrl      = url,
            amount      = 0,
            active      = true
           
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
    
  entrypoint sLength() : int =
         state.sLength   
`;
var contractAddress= "ct_yF3H7R57JufeyVfZuBMGwD9eovBtWGctNjpuwyZWjub9Z7NRM";

var client =null;

var serviceArray = [];
var serviceLength =0;

async function renderService() {
    var template=$('#template').html();
    Mustache.parse(template);
    var render = Mustache.render(template, {serviceArray});
    $('#service-lists').html(render);
    partTotal = await callStatic('sLength', [])
    $('#total').html(serviceLength);
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

        
    }


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

