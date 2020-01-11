var contractSource = `
contract ServiceLocatorContract=

  record service = {
         index               : int,
         sAddress            : address,
         sName               : string,
         sLocation           : string,
         mapUrl              : string
         
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
            mapUrl      = url
           
            }
        
        let index = sLength() +1
        
        put( state { services[index] = service, sLength = index})
        
  entrypoint getService(index :int ) :service =
    state.services[index]
    
    
  entrypoint sLength() : int =
        state.sLength       
`;
var contractAddress= "ct_pixUugVUCiQPJ2fSSGC2tprjGo7xBid9tkriPztfSjjW5CyWr";

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
          
        })

        
    }


 renderService();
location.reload((true));
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

