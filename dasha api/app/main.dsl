import "commonReactions/all.dsl";

context 
{
    // declare input variables phone and name  - these variables are passed at the outset of the conversation. In this case, the phone number and customer’s name 
    input phone: string;

    // declare storage variables 
    output first_name: string = "";
    output last_name: string = "";
    output device_num: string = "";
    output zip_code: string = "";

}

// declaring external functions


start node root 
{
    do 
    {
        #connectSafe($phone);
        #waitForSpeech(1000);
        #sayText("Hello. My name is Dasha. Reply with coooool if safe and urghhh if unsafe?");
        wait *;
    }   
    transitions 
    {

    }
}

digression how_safe
{
    conditions {on #messageHasData("uh");} 
    do 
    {
        #sayText("This is from Delhi central police station. The police car is just arriving at your current location");
        wait *;
    }
}

digression safe

{
    conditions {on #messageHasIntent("cool");} 
    do
    {
        #sayText("It's okay to feel alone sometimes and the roads might be scary but you have me!");
        wait *;
    }   
    
} 

// additional digressions 

digression how_are_you
{
    conditions {on #messageHasIntent("how are you");}
    do 
    {
        #sayText("I'm well, thank you!", repeatMode: "ignore");
        #repeat(); // let the app know to repeat the phrase in the node from which the digression was called, when go back to the node 
        return; // go back to the node from which we got distracted into the digression 
    }
}

digression bye 
{
    conditions { on #messageHasIntent("bye"); }
    do 
    {
        #sayText("Sorry we didn't see this through. Call back another time. Bye!");
        #disconnect();
        exit;
    }
}
